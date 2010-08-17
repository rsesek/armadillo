#!/usr/bin/env python2.5
import os
import subprocess
import sys

ROOT     = os.path.dirname(os.path.realpath(__file__))
SRC_PATH = os.path.join(ROOT, 'src')
PROD_PATH = os.path.join(ROOT, 'out')

SOURCES = [
  'server.go',
  'main.go'
]
PRODUCT_NAME = 'armadillo'

COMPILER = '8g'
LINKER = '8l'
O_EXTENSION = '8'

def _ObjFileName(gofile):
  gofile = os.path.basename(gofile)
  return os.path.join(PROD_PATH, os.path.splitext(gofile)[0] + '.' + O_EXTENSION)

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

if __name__ == '__main__':
  Main()
