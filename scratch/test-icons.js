try {
  const lu = require('react-icons/lu');
  console.log("react-icons/lu is available!");
  const icons = [
    'LuSparkles', 'LuBookOpen', 'LuFileText', 'LuCheckSquare', 
    'LuMegaphone', 'LuClipboard', 'LuEdit3', 'LuBook', 
    'LuMessageSquare', 'LuStar', 'LuClock', 'LuGrid', 
    'LuTrash2', 'LuSearch', 'LuCopy', 'LuDownload', 
    'LuShare2', 'LuHeart', 'LuFolder', 'LuExternalLink'
  ];
  icons.forEach(name => {
    if (lu[name]) {
      console.log(`✅ ${name} exists`);
    } else {
      console.log(`❌ ${name} does not exist`);
    }
  });
} catch (e) {
  console.error("Error loading react-icons/lu:", e);
}
