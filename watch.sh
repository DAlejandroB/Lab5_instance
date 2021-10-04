#!/bin/bash

(echo "`date +'%H:%M:%S'` $2 $(curl --silent $1:$2/status)") >> log.txt