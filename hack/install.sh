#!/bin/bash
#
# MIT License
# Copyright (c) 2020 International Business Machines

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# check if running piped from curl
if [ -z ${BASH_SOURCE} ]; then
  [ -d /tmp/kubecrd-vscode-extension ] && rm -rf /tmp/kubecrd-vscode-extension
  mkdir -p /tmp/kubecrd-vscode-extension
  cd /tmp/kubecrd-vscode-extension
  echo "* Downloading ibmcloudservice extension..."
  curl -sLJO https://github.com/IBM/kubecrd-vscode-extension/archive/master.zip
  unzip -qq kubecrd-vscode-extension-master.zip
  mv kubecrd-vscode-extension-master kubecrd-vscode-extension-0.0.1
  cp -r kubecrd-vscode-extension-0.0.1 ~/.vscode/extensions/.
  cd /tmp
  rm -rf kubecrd-vscode-extension
  echo "Installed at ~/.vscode/extensions/kubecrd-vscode-extension-0.0.1"
else
  cp -r ../../kubecrd-vscode-extension ~/.vscode/extensions/kubecrd-vscode-extension-0.0.1
fi
