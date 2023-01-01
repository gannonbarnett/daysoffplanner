rm -rf build
python3 freeze.py
echo "daysoffplanner.com" > build/CNAME
git add .
git commit -m "deploy"
git push
git subtree push --prefix build origin gh-pages
