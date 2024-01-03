// cmd ex: node . '0-1' '제목' 1

// 1. mhtmlToHtml
// 2. htmlToTxt
// 3. checkNextFileExist
// 4. 쓸 데 없는 png, mhtml, html 등을 삭제

const fs = require('fs');
const { JSDOM } = require('jsdom');
const { exec } = require('child_process');

const PYTHON_SCRIPT_PATH = 'mhtmlToHtml.py';
const RIGHT_ELEMENT_STYLE =
  'margin-top:67.5pt; margin-bottom:0pt; line-height:13.25pt; padding-top:11pt; padding-bottom:11pt; background-color:#ffffff';
const DOMAIN = 'ridi';

const getFileNameTemplate = (domain, episode) => {
  switch (domain) {
    case 'ridi':
      return ` ${episode}화 - 리디`;
    default:
      return episode;
  }
};

async function mhtmlToHtml(filePath) {
  return new Promise((resolve, reject) => {
    exec(`python "${PYTHON_SCRIPT_PATH}" "${filePath}"`, (error, stdout) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      console.log(filePath);
      resolve(stdout);
    });
  });
}

function htmlToTxt(filePath, outputFilePath) {
  const htmlFileName = filePath + `.html`;
  const html = fs.readFileSync(htmlFileName).toString();

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const textElements = document.querySelectorAll('body > div > p');
  const excludeElementIndex = Array.from(textElements).findIndex(
    $ele => $ele.getAttribute('style') === RIGHT_ELEMENT_STYLE
  );

  const includedElements = Array.from(textElements).slice(
    1,
    excludeElementIndex
  );

  includedElements.forEach(ele => {
    const content = ele.textContent + '\n\n';

    fs.writeFileSync(outputFilePath, content, {
      encoding: 'utf8',
      flag: 'a',
    });
  });
}

function deleteRestFiles(folderPath, startEpisode) {
  let episode = startEpisode;
  // let fileNameTemplate = ` ${episode}화 - 리디`;
  let fileNameTemplate = getFileNameTemplate(DOMAIN, episode);

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err}`);
      return;
    }

    files.sort((a, b) => {
      const getNumberPart = str => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : NaN;
      };

      const aNumber = getNumberPart(a);
      const bNumber = getNumberPart(b);

      return aNumber - bNumber || a.localeCompare(b, 'en', { numeric: true });
    });

    files.forEach(file => {
      const filePath = folderPath + file;

      if (
        file.endsWith('리디.001.png') ||
        file.endsWith(fileNameTemplate + '.html') ||
        file.endsWith(fileNameTemplate + '.mhtml')
      ) {
        fs.unlink(filePath, err => {});

        if (file.endsWith('.mhtml')) {
          ++episode;
          fileNameTemplate = getFileNameTemplate(DOMAIN, episode);
          // fileNameTemplate = ` ${++episode}화 - 리디`;
        }
      }
    });
  });
}

async function mhtmlToTxt(process) {
  let [, , folderNumber, title, startEpisode] = process.argv;

  let folderType;
  switch (folderNumber) {
    case '0':
      folderType = '0 soon';
      break;
    case '1':
      folderType = '1 read';
      break;
    case '2':
      folderType = '2 continuous';
      break;
    case '3':
      folderType = '3 test';
      break;
    default:
      folderType = '';
  }

  if (process.argv.length < 5) {
    // folderNumber = '';
    title = process.argv[2];
    startEpisode = process.argv[3];
  }

  let currentEpisode = startEpisode;

  let folderPath = `../${folderType}/${title}/`;
  if (!folderType) folderPath = `../${title}/`;
  // let folderPath = `../${folderNumber} ${title}/`;
  // if (!folderNumber || folderNumber === 0) folderPath = `../${title}/`;
  // let filePath = folderPath + `${title} ${currentEpisode}화 - 리디`
  let filePath =
    folderPath + title + getFileNameTemplate(DOMAIN, currentEpisode);
  let outputFilePath = folderPath + `${startEpisode}.txt`;

  async function checkNextFileExist() {
    while (fs.existsSync(filePath + '.mhtml')) {
      await mhtmlToHtml(filePath);
      htmlToTxt(filePath, outputFilePath);

      currentEpisode++;
      // filePath = folderPath + `${title} ${currentEpisode}화 - 리디`;
      filePath =
        folderPath + title + getFileNameTemplate(DOMAIN, currentEpisode);
    }

    let newFileName = folderPath + `${title} ${startEpisode}.txt`;
    if (startEpisode != currentEpisode - 1) {
      newFileName =
        folderPath + `${title} ${startEpisode}-${currentEpisode - 1}.txt`;
    }

    fs.renameSync(outputFilePath, newFileName, error => {
      console.log('txt 파일명 수정 불가!');
    });
  }

  await checkNextFileExist();
  await deleteRestFiles(folderPath, startEpisode);

  console.log('\nprocess complete ᕙ( •̀ ᗜ •́ )ᕗ');
}

mhtmlToTxt(process);
