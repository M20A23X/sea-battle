TEMP_FILE="files"
PACKAGES_ROOT="packages/"
DATABASE="database"

package=$1

if [[ "$package" == "$DATABASE" ]]; then
  PACKAGES_DIR=''
fi

git diff --name-only $BRANCH_DEV HEAD >$TEMP_FILE
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
