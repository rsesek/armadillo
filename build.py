#!/usr/bin/env python2.5
#
# Armadillo File Manager
# Copyright (c) 2010-2011, Robert Sesek <http://www.bluestatic.org>
# 
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or any later version.
#

import optparse
import os
import re
import shutil
import string
import subprocess
import sys
import time

ROOT      = os.path.dirname(os.path.realpath(__file__))
SRC_PATH  = os.path.join(ROOT, 'src')
PROD_PATH = os.path.join(ROOT, 'out')
FE_PATH   = os.path.join(ROOT, 'web_frontend')

CLOSURE_COMPILER = os.path.join(ROOT, 'closure-compiler.jar')

VERSION_FILE = os.path.join(FE_PATH, 'version.js.proto')

SOURCES = [
  'config.go',
  'paths.go',
  'tv_rename.go',
  'server.go',
  'main.go'
]
SOURCES_FE = [
  'jquery-1.7.1.js',
  'utils.js',
  'version.js',
  'tv_renamer.js',
  'path_control.js',
  'actor.js',
  'file.js',
  'main.js',
]
RESOURCES_FE = [
  'index.html',
  'screen.css',
  'mobile.css',
  'reset.css'
]
PRODUCT_NAME = 'armadillo'

# The Golang version (hg id).
BACK_END_COMPILER_VERSION = 'c1702f36df03 (release-branch.r60) release/release.r60.3'

COMPILER = '6g'
LINKER = '6l'
O_EXTENSION = '6'

def _CompileBackEnd():
  for gofile in SOURCES:
    gofile = os.path.join(SRC_PATH, gofile)
    args = [ COMPILER, gofile ]
    print '  ' + ' '.join(args)
    handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
    handle.wait()
  
  # Link
  args = [ LINKER, '-o', os.path.join(PROD_PATH, PRODUCT_NAME), 'main.' + O_EXTENSION ]
  print '  ' + ' ' .join(args)
  handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
  handle.wait()

def _StampVersion(options):
  print '=== Version Stamp ==='
  if os.path.exists(VERSION_FILE):
    gitcrement = subprocess.Popen([ 'gitcrement', 'next' ], stdout = subprocess.PIPE, cwd = ROOT)
    gitcrement.wait()
    build_stamp = gitcrement.stdout.read().strip()
    time_stamp = str(int(time.time()))
    
    fd = open(VERSION_FILE, 'a+')
    fd.seek(0)
    lines = fd.readlines()
    fd.seek(0)
    fd.truncate()
    for line in lines:
      line = re.sub(r'(BUILD =) ([0-9\.]+)', r'\1 ' + build_stamp, line)
      line = re.sub(r'(STAMP =) ([0-9]+)', r'\1 ' + time_stamp, line)
      fd.write(line)
    fd.close()
    print '  BUILD ' + build_stamp + ' @ ' + time_stamp
    if options.compile_fe:
      mfiles = subprocess.Popen([ 'git', 'ls-files', '-m' ], stdout = subprocess.PIPE, cwd = ROOT)
      mfiles.wait()
      versioned_stamp_file = string.replace(VERSION_FILE, '.proto', '')
      shutil.copy(VERSION_FILE, versioned_stamp_file)
      print '  COPY version.js.proto -> version.js'
      if not len(mfiles.stdout.readlines()):
        subprocess.Popen([ 'git', 'commit', '--author=Armadillo Build Script <armadillo@bluestatic.org>',
            '-m', 'Stamp version.js @ ' + build_stamp + '.', versioned_stamp_file ], stdout = sys.stdout,
                stderr = sys.stderr).wait()

def _CompileFrontEnd(options):
  # Copy
  print '=== Copying Resources ==='
  fe_resources = os.path.join(PROD_PATH, 'fe')
  subprocess.Popen([ 'rm', '-rf', fe_resources ]).wait()
  os.mkdir(fe_resources)
  for resource in RESOURCES_FE:
    print '  COPY ' + resource
    shutil.copy(os.path.join(FE_PATH, resource), fe_resources)
  
  # Version
  _StampVersion(options)
  
  # Compile JS.
  print '=== Compiling Front End ==='
  outfile = os.path.join(PROD_PATH, 'fe', PRODUCT_NAME + '.js')
  if options.compile_fe:
    fe_sources = map(lambda f: '--js=' + os.path.join(FE_PATH, f), SOURCES_FE)
    args = [ 'java', '-jar', CLOSURE_COMPILER ]
    args.extend(fe_sources)
    args.extend(['--js_output_file', outfile, '--compilation_level', 'SIMPLE_OPTIMIZATIONS'])
    print '  ' + ' '.join(args)
    handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
    handle.wait()
  else:
    fd = open(outfile, 'w+')
    for fe_source in SOURCES_FE:
      fd2 = open(os.path.join(FE_PATH, fe_source), 'r')
      fd.write('// === ' + fe_source + '\n')
      fd.write(fd2.read())
      fd2.close()
    fd.close()
    print '  DONE'


def Main():
  parser = optparse.OptionParser()
  parser.add_option('-c', '--closure_fe', action="store_true", dest="compile_fe",
                    help="Run the Front End inputs through the Closure Compiler")
  parser.add_option('-b', '--back-end', action="store_true", dest="backend_only",
                    help="Compiles only the back-end")
  parser.add_option('-f', '--front-end', action="store_true", dest="frontend_only",
                    help="Compiles only the front-end")
  (options, args) = parser.parse_args()

  print '=== Starting Build ==='
  os.chdir(PROD_PATH)
  
  if not options.frontend_only:
    _CompileBackEnd()
  
  if not options.backend_only:
    _CompileFrontEnd(options)
  
if __name__ == '__main__':
  Main()
