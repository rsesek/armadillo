#!/usr/bin/env python2.5
#
# Armadillo File Manager
# Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
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

CLOSURE_SVN      = 'http://closure-library.googlecode.com/svn/trunk/'
CLOSURE_REV      = '235'
CLOSURE_DEST     = os.path.join(ROOT, 'closure')
CLOSURE_COMPILER = os.path.join(ROOT, 'closure-compiler.jar')
CLOSURE_CALCDEPS = os.path.join(CLOSURE_DEST, 'closure', 'bin', 'calcdeps.py')

VERSION_FILE = os.path.join(FE_PATH, 'version.js.proto')

SOURCES = [
  'paths.go',
  'server.go',
  'main.go'
]
SOURCES_FE = [
  'version.js',
  'path_control.js',
  'actor.js',
  'file.js',
  'main.js',
]
RESOURCES_FE = [
  'index.html',
  'screen.css',
  'reset.css'
]
RESOURCES_CLOSURE = [
  'common.css',
  'dialog.css',
  'menu.css',
  'menuitem.css',
  'menubutton.css',
]
PRODUCT_NAME = 'armadillo'

COMPILER = '8g'
LINKER = '8l'
O_EXTENSION = '8'

def _ObjFileName(gofile):
  gofile = os.path.basename(gofile)
  return os.path.join(PROD_PATH, os.path.splitext(gofile)[0] + '.' + O_EXTENSION)

def _PullDeps():
  print '=== Pulling Dependencies ==='
  if os.path.exists(CLOSURE_DEST):
    handle = subprocess.Popen([ 'svn', 'info', CLOSURE_DEST ], stdout = subprocess.PIPE)
    handle.wait()
    for line in handle.stdout:
      if line.startswith('Revision'):
        if not line.startswith('Revision: ' + CLOSURE_REV):
          subprocess.Popen([ 'svn', 'update', '-r', CLOSURE_REV, CLOSURE_DEST ]).wait()
        else:
          print '  Closure @ ' + CLOSURE_REV
  else:
    subprocess.Popen([ 'svn', 'checkout', '-r', CLOSURE_REV, CLOSURE_SVN, CLOSURE_DEST ]).wait()

def Main():
  parser = optparse.OptionParser()
  parser.add_option('-c', '--closure_fe', action="store_true", dest="compile_fe",
                    help="Run the Front End inputs through the Closure Compiler")
  (options, args) = parser.parse_args()

  print '=== Starting Build ==='
  os.chdir(PROD_PATH)
  
  # Compile.
  for gofile in SOURCES:
    gofile = os.path.join(SRC_PATH, gofile)
    args = [ COMPILER, gofile ]
    print '  ' + ' '.join(args)
    handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
    handle.wait()
  
  # Link
  objects = map(_ObjFileName, SOURCES)
  args = [ LINKER, '-o', os.path.join(PROD_PATH, PRODUCT_NAME), 'main.8' ]
  print '  ' + ' ' .join(args)
  handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
  handle.wait()
  
  _PullDeps()
  
  # Copy
  print '=== Copying Resources ==='
  fe_resources = os.path.join(PROD_PATH, 'fe')
  subprocess.Popen([ 'rm', '-rf', fe_resources ]).wait()
  os.mkdir(fe_resources)
  for resource in RESOURCES_FE:
    print '  COPY ' + resource
    shutil.copy(os.path.join(FE_PATH, resource), fe_resources)
  fd = open(os.path.join(fe_resources, 'closure.css'), 'w+')
  fd.write('/*=== Generated Resources for Closure Library ===*/')
  for resource in RESOURCES_CLOSURE:
    print '  COPY closure/' + resource
    respath = os.path.join(CLOSURE_DEST, 'closure', 'goog', 'css', resource)
    ofd = open(respath, 'r')
    fd.write('\n\n/*=== File: ' + respath.replace(ROOT, '/') + ' ===*/\n')
    fd.writelines(ofd.readlines())
    ofd.close()
  fd.close()
  
  # Version
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
      line = re.sub(r'(BUILD =) ([0-9]+)', r'\1 ' + build_stamp, line)
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
  
  # Compile JS.
  print '=== Compiling Front End ==='
  outfile = os.path.join(PROD_PATH, 'fe', PRODUCT_NAME + '.js')
  fe_sources = map(lambda f: '-i' + os.path.join(FE_PATH, f), SOURCES_FE)
  closure_sources = os.path.join(CLOSURE_DEST, 'closure', 'goog')
  args = [ CLOSURE_CALCDEPS ]
  args.extend(fe_sources)
  output = "script"
  if options.compile_fe:
    output = "compiled"
  args.extend([ '-p', closure_sources, '-o', output, '-c', CLOSURE_COMPILER,
      '--output_file', outfile ])
  print '  ' + ' '.join(args)
  handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
  handle.wait()

if __name__ == '__main__':
  Main()
