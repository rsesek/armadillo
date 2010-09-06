#!/usr/bin/env python2.5
#
# Armadillo File Manager
# Copyright (c) 2010, Robert Sesek <http://www.bluestatic.org>
# 
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU General Public License as published by the Free Software
# Foundation, either version 3 of the License, or any later version.
#
import os
import shutil
import subprocess
import sys

ROOT      = os.path.dirname(os.path.realpath(__file__))
SRC_PATH  = os.path.join(ROOT, 'src')
PROD_PATH = os.path.join(ROOT, 'out')
FE_PATH   = os.path.join(ROOT, 'web_frontend')

CLOSURE_SVN      = 'http://closure-library.googlecode.com/svn/trunk/'
CLOSURE_REV      = '235'
CLOSURE_DEST     = os.path.join(ROOT, 'closure')
CLOSURE_COMPILER = os.path.join(ROOT, 'closure-compiler.jar')
CLOSURE_CALCDEPS = os.path.join(CLOSURE_DEST, 'closure', 'bin', 'calcdeps.py')

SOURCES = [
  'paths.go',
  'server.go',
  'main.go'
]
SOURCES_FE = [
  'actor.js',
  'file.js',
  'main.js',
]
RESOURCES_FE = [
  'index.html',
  'screen.css',
  'reset.css'
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
  
  # Compile JS.
  print '=== Compiling Front End ==='
  outfile = os.path.join(PROD_PATH, 'fe', PRODUCT_NAME + '.js')
  fe_sources = map(lambda f: '-i' + os.path.join(FE_PATH, f), SOURCES_FE)
  closure_sources = os.path.join(CLOSURE_DEST, 'closure', 'goog')
  args = [ CLOSURE_CALCDEPS ]
  args.extend(fe_sources)
  args.extend([ '-p', closure_sources, '-o', 'compiled', '-c', CLOSURE_COMPILER,
      '--output_file', outfile ])
  print '  ' + ' '.join(args)
  handle = subprocess.Popen(args, stdout = sys.stdout, stderr = sys.stderr)
  handle.wait()

if __name__ == '__main__':
  Main()
