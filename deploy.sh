git add .
git commit -m "deploy"
git push
git subtree split --prefix source -b gh-pages 
git push -f origin gh-pages:gh-pages
git branch -D gh-pages 
