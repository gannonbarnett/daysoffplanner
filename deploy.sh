rm -rf build
python3 freeze.py
echo "daysoffplanner.com" > build/CNAME
git add .
git commit -m "deploy"
git push
git subtree split --prefix build -b gh-pages 
git push -f origin gh-pages:gh-pages
git branch -D gh-pages 
git subtree push --prefix build origin gh-pages
