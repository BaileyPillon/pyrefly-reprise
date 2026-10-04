[Back to the changelog](../../CHANGELOG.md)

# 2026-10-04 · Release 38 on echoesofspira.com

Address: https://echoesofspira.com (main 8136f2ed)

- **Both:** the game has its own address, **echoesofspira.com**, served by Cloudflare.
  www.echoesofspira.com forwards to it. It is release 38, unchanged: all 1,932 files were checked
  byte for byte on the new address after the upload.

  ![The title card on echoesofspira.com at 1600x900](../screenshots/cf-switch/title-echoesofspira.com-1600x900.png)
  ![The title card on echoesofspira.com on a 390x844 phone](../screenshots/cf-switch/title-echoesofspira.com-390x844.png)

  *The title card on echoesofspira.com at 1600x900 and on a 390x844 phone.*

- **Both:** saves are kept per address, so echoesofspira.com starts with fresh saves. The old
  GitHub address keeps its own saves and stays up.
- **Behind the scenes:** releases now go to Cloudflare by default. Only changed files are uploaded,
  earlier versions can be rolled back in seconds, and the critic and the tools follow the new address.
