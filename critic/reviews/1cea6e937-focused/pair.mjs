import sharp from 'file:///D:/pyrefly-release55/node_modules/sharp/dist/index.mjs';
const [a,b,out]=process.argv.slice(2);
const A=await sharp(a).resize(800).toBuffer(), B=await sharp(b).resize(800).toBuffer();
await sharp({create:{width:1600,height:450,channels:3,background:'#000'}}).composite([{input:A,left:0,top:0},{input:B,left:800,top:0}]).jpeg({quality:85}).toFile(out);
