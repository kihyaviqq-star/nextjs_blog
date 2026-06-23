git add prisma/
git commit -m "feat: database schema expansion and migrations"

git add app/admin/ app/api/admin/ scripts/
git commit -m "feat: admin utilities and scripts"

git add app/software/ app/tools/ components/software/ components/tools/ components/reviews/ components/star-rating.tsx components/screenshot-gallery.tsx components/expandable-text.tsx app/api/comments/ app/api/reviews/ components/comments/
git commit -m "feat: software catalog and reviews system"

git add app/dashboard/ lib/services/ app/api/cron/
git commit -m "feat: ai auto-blogging automation and dashboard"

git add components/footer-layout.tsx components/footer-client.tsx components/footer.tsx components/header-client.tsx components/mobile-menu.tsx components/user-menu.tsx
git commit -m "fix: ui components, navigation, and layout enhancements"

git add app/page.tsx components/search-filter-bar.tsx
git commit -m "fix: homepage animations, search bar, and cyrillic search"

git add components/blog/block-renderer.tsx
git commit -m "fix: html rendering in blog articles"

git add middleware.ts next.config.ts tailwind.config.ts package.json package-lock.json
git commit -m "chore: configuration, middleware, and dependency updates"

git add scratch/
git commit -m "chore: add scratch scripts"

git add .
git commit -m "chore: catch all remaining uncommitted files"
