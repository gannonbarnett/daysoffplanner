python3 freeze.py
git push origin `git subtree split --prefix build gh-pages`:gh-pages
git subtree push --prefix build origin gh-pages