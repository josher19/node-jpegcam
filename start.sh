#!/bin/sh
here=`dirname $0`
echo Directory $here
cd `dirname $0`
node ./index.js &
