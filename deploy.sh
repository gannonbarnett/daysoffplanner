rm -rf build
python3 freeze.py
echo "daysoffplanner.com" > build/CNAME
git subtree push --prefix build origin gh-pages
