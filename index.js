// test pgconnection
import { config } from 'dotenv';
import { Pool, Client } from 'pg';
import { execSync } from 'child_process';
config();

const pool = new Pool();

async function getActiveIp() {
  const sql = 'SELECT * FROM public.ips WHERE is_active = true';
  let response = await pool.query(sql);
  return response.rows[0];
}

/*async function getAllNonBannedIps() {
  const sql = `SELECT a.id id, address, default_gateway, reverse_dns
    FROM public.ips a
    LEFT OUTER JOIN public.ip_banned_by_scraping b
    ON a.id = b.ip_id
    WHERE b.ip_id IS NULL`;
  let response = await pool.query(sql);
  return response.rows;
}*/

async function getAllNonBannedIps() {
  const sql = `SELECT id, address, default_gateway, reverse_dns
    FROM public.ips;`;
  let response = await pool.query(sql);
  return response.rows;
}

async function getNextIp() {
  let activeIp = await getActiveIp();
  let ips = await getAllNonBannedIps();
  if (ips.length > 1) {
    let index = ips.findIndex(v => v.id === activeIp.id);
    let nextIndex = index + 1 === ips.length ? 0 : index + 1;
    return ips[nextIndex];
  } else {
    return null;
  }
}

async function main () {
  let nextIp = await getNextIp();
  if (nextIp === null) {
    console.log(`Can't get the next ip`);
    pool.end();
    return null;
  }

  let broadcast = nextIp.address.split('.');
  broadcast[3] = 255;
  broadcast = broadcast.join('.');
  pool.end();

  execSync('sudo ip addr flush dev eth0');
  execSync('sudo ip link set eth0 up');
  execSync(`sudo ip addr add ${nextIp.address} broadcast ${broadcast} dev eth0`);
  execSync(`sudo ip route add default via ${nextIp.default_gateway}`);
}

main();
