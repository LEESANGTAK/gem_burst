Set-Location "C:\Users\stakl\Documents\antigravity\gem_burst"

# Git setup in gem_burst
git config user.name "Tak"
git config user.email "chst27@gmail.com"

git status
git add .
git commit -m "feat: initial commit - Prism Cross: Gem Burst (Candy Gem Silhouettes, Shatter Physics, Special Gems, Fever Mode)"
git branch -M main

# Check if origin exists
$remotes = git remote
if ($remotes -contains "origin") {
    git remote set-url origin "https://github.com/LEESANGTAK/gem_burst.git"
} else {
    git remote add origin "https://github.com/LEESANGTAK/gem_burst.git"
}

git remote -v

# Push to origin main
Write-Host "Pushing to remote origin main..."
git push -u origin main
