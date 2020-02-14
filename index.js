import { config } from 'dotenv';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { existsSync, writeFileSync, readFileSync } from 'fs';

config();

if(!existsSync(resolve('./currentIp'))) {
  writeFileSync(resolve('./currentIp'), process.env.IPPOOL);
} else {
  // get current ip
  let currentIp = readFileSync(resolve('./currentIp'), 'utf8');

  // get the constant part of the ip
  let fixedBlock = currentIp.split(':').slice(0,4);

  // get the variable part of the ip and parse to decimal
  let range = parseInt(currentIp.split(':').slice(4,8).join(''), 16);

  // get the next ip
  range++;

  // convert the number to hex again
  range = range.toString(16);

  // fill with zeros
  for (let i = range.length; i < 16; i++) {
    range = "0"+range;
  }

  // declare the array to save the variable part
  let rangeArr = [];

  // split again in array
  for (let i = 0; i < 4; i++) {
    rangeArr[i] = range.substr(i*4, 4);
  }

  let newIp = fixedBlock.concat(rangeArr).join(':');

  writeFileSync(resolve('./currentIp'), newIp);
  currentIp = currentIp+'/128';
  newIp = newIp+'/128';

  execSync(`sudo ip a del ${currentIp} dev eth0`);
  execSync(`sudo ip a add ${newIp} dev eth0`);

}
