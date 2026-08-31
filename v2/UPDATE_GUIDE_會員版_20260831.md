# 會員版網站更新指南（五項術數工具整合）

## 本次新增
首頁第二層術數工具列：真祿馬貴人、文昌位、財位、桃花位、八節三奇。

新增頁面：
- zhen-luma.html
- wenchang.html
- caiwei.html
- taohua.html
- bajie-sanqi.html

新增樣式：assets/tools-nav-v20260831.css

## 更新原則
1. 不刪除 v2 資料夾。
2. 使用「更新補丁」解壓後，把內容拖進 GitHub repository 的 v2/ 根目錄。
3. GitHub 出現同名 index.html 時選擇覆蓋／提交更新；新增頁面直接建立。
4. Cloudflare Pages 等待部署完成後，用無痕視窗登入會員站檢查。
5. 先測首頁原有「流年祿馬貴人」，再測四大吉時、永吉造命、通書六十甲子造命，最後逐一測五個新工具。

## 回復方式
若新工具版有問題，只需回復 index.html，或重新上傳整合前的穩定完整包；會員資料仍在 Supabase，不會因靜態檔回復而刪除。
