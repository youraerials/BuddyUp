#!/bin/sh

echo "it's time to buddy up!"

# HEY!  YOU WILL NEED TO REPLACE THE [YOUR PATH] instances here with whatever the
# real path for you is....  I know, adding the path as a script arg is coming, 
# gimmie a break, it's 2AM.


# first, we need to make sure the /data filesystem on device is mounted read/write
# in most cases it won't be...
adb shell  mount -o remount rw /data


echo "creating zips"

# you probably know that a B2G app package is really just a zip file, created at the root of
# the application directory (that is, importantly, not the directory itself zipped up, but a 
# zip of the contents!)  so here, i'm just movigng into the directory (wherever the app's 
# index.html file is) and creating a zip file there as "application.zip"

cd /Users/[YOUR PATH]/b2g/buddyup-system
zip -r application.zip *


echo "done zipping."


# now we stop the b2g proecess with adb shell
adb shell stop b2g

echo "installing..."

# and push the new zip file and the app's manifest file where we want it to go on the device 
# filesystem.  in my case, I'm replacing the system app so: 

adb push /Users/[YOUR PATH]/b2g/buddyup-system/application.zip /data/local/webapps/system.gaiamobile.org/application.zip


echo "done! B2G is restarting."

# and... that's it!  restart b2g and we'll see the new system file loaded.  you might 
# remount the system volume as read-only again here, but I don't bother because I'm 
# rolling the content over so often in development....

adb shell sync
adb shell start b2g

