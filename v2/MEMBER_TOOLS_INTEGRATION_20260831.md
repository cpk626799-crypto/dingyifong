# 會員版術數工具整合說明｜2026-08-31

本次以既有穩定會員版為母體，僅做增量整合。

新增獨立會員頁：
- zhen-luma.html：真祿馬貴人
- wenchang.html：文昌位
- caiwei.html：財位
- taohua.html：桃花位
- bajie-sanqi.html：八節三奇

新增樣式：
- assets/tools-nav-v20260831.css：首頁與新增工具頁第二層五欄工具列、工具頁主導覽固定規格。

既有 index.html 僅新增第二層工具列與新 CSS 引用；原有查詢 DOM、原有 JS 引用與會員驗證均保留。
新增五頁均引用既有 assets/member-auth.js，因此必須登入且會員狀態有效才能使用。
原會員核心、四大吉時、永吉造命、通書六十甲子造命等檔案未改寫。
