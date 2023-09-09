TEMP_FILE="files"
PACKAGES_ROOT="packages/"
DATABASE="database"

package=$1

if [[ "$package" == "$DATABASE" ]]; then
  PACKAGES_DIR=''
fi

if [[ "$EVENT_NAME" == 'pull_request' ]]; then
  echo "checkRes=$(git diff --name-only -r HEAD^1 HEAD | xargs)" >$TEMP_FILE
else
  echo "checkRes=$(git diff --name-only $EVENT_BEFORE $EVENT_AFTER | xargs)" >$TEMP_FILE
fi

git diff --name-only $EVENT_BEFORE $EVENT_AFTER >$TEMP_FILE
while IFS= read -r file; do
  checkRes=$(echo "$file" | grep "$PACKAGES_ROOT$package/")
  if [[ $checkRes ]]; then
    echo "Changed files found since $BRANCH_DEV"
    echo "$checkRes"
    echo "::set-output name=delta::true"
    break
  fi
done <$TEMP_FILE
rm $TEMP_FILE
