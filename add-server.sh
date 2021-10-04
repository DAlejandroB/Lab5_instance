echo Running server...;docker run -v /var/run/docker.sock:/var/run/docker.sock --name $2 -p $1:$1 --env PORT=$1 -d instance_img;

exit