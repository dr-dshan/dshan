MINIMAL PUBLIC SITE CHANGE

Do not replace the existing pages.

1) Upload lab-private-links.js to the root of the current dshan repository.
2) Add this one line before </body> on the pages whose top navigation should show WIKI:

<script src="./lab-private-links.js"></script>

3) After Cloudflare deployment, change PRIVATE_APP_URL in lab-private-links.js.

The WIKI content itself is NOT stored in the public GitHub repository.
