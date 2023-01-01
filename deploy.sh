rm -rf build
python3 freeze.py
git add .
git commit -m "deploy"
echo "daysoffplanner.com" > build/CNAME
git subtree push --prefix build origin gh-pages
