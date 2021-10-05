#!/bin/bash

(echo "$2 $(curl --silent $1:$2/status)") >> log.txt