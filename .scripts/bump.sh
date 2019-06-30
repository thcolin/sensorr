#!env bash

[[ '' == $1 ]] && echo "Please provide version argument: x.x.x" && exit 1

git stash
# npm run test
npm run build
npm --no-git-tag-version version $1
git add -f dist package.json
git commit -m $1
git tag v$1
git push --tags
git reset --hard HEAD~1
npm --no-git-tag-version version $1
git add package.json
git add package-lock.json
git commit -m $1
git push
git stash pop
