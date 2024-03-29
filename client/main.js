import { DiscordSDK } from "@discord/embedded-app-sdk";

import rocketLogo from '/rocket.png';
import sushi from './sushi.png';
import songmp3 from './song.mp3'
import "./style.css";

// Will eventually store the authenticated user's access_token
let auth;

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
    ],
  });

  // Retrieve an access_token from your activity's server
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

async function getUserAvatar() {
  const app = document.querySelector('#app');

  // Fetch user information from the Discord API
  const user = await fetch(`https://discord.com/api/v10/users/@me`, {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // Get the user's avatar
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

  return avatarUrl;
}




function addSong() {
  const message = document.querySelector('#message').value;
  if (!message) return; // Ne rien faire si le message est vide


  const playlist = document.querySelector('.playlist');

  const div = document.createElement('div');
  div.className = 'playlist-item';

  const avatarImg = document.createElement('img');
  avatarImg.className = 'avatar';
  getUserAvatar().then((avatarUrl) => {
    avatarImg.src = avatarUrl;
  });
  avatarImg.setAttribute('alt', 'Avatar');

  const text = document.createTextNode(message);

  div.appendChild(avatarImg);
  div.appendChild(text);

  playlist.appendChild(div);

  document.querySelector('#message').value = '';
}

let audio = new Audio(songmp3);

function playSong() {
  audio.play();
}

function pauseSong() {
  audio.pause();
}

function restartSong() {
  // Mettez en pause l'audio s'il est en cours de lecture
  if (!audio.paused) {
    audio.pause();
  }
  // Réinitialisez la position de lecture au début du fichier audio
  audio.currentTime = 0;
  // Reprenez la lecture
  audio.play();
}

function updateProgress() {
  const progressBar = document.querySelector('.progress');
  // Met à jour la valeur de la barre de progression en fonction de la position actuelle de lecture
  progressBar.value = (audio.currentTime / audio.duration) * 100;

  const currentTime = document.querySelector('.current-time');
  const totalTime = document.querySelector('.total-time');

  // Convertir le temps écoulé en minutes:secondes
  let currentMinutes = Math.floor(audio.currentTime / 60);
  let currentSeconds = Math.floor(audio.currentTime - currentMinutes * 60);

  // Convertir la durée totale en minutes:secondes
  let totalMinutes = Math.floor(audio.duration / 60);
  let totalSeconds = Math.floor(audio.duration - totalMinutes * 60);

  // Ajouter un 0 initial si les secondes sont inférieures à 10
  if (currentSeconds < 10) {
    currentSeconds = "0" + currentSeconds;
  }
  if (totalSeconds < 10) {
    totalSeconds = "0" + totalSeconds;
  }

  // Afficher le temps écoulé et la durée totale
  currentTime.textContent = currentMinutes + ":" + currentSeconds;
  totalTime.textContent = totalMinutes + ":" + totalSeconds;
}

function clearQueue() {
  const playlist = document.querySelector('.playlist');
  // Remove each avatar
  const avatar = document.querySelectorAll('.avatar');
  avatar.forEach((element) => {
    element.remove();
  });
  playlist.innerHTML = '';
}

function updateVolume() {
  const volume = document.querySelector('.volume');
  audio.volume = volume.value / 100;
}

import playSvg from './svgs/play-circle-svgrepo-com.svg'
import nextSvg from './svgs/next-svgrepo-com.svg';
import volumeIcon from './svgs/volume-interface-symbol-svgrepo-com.svg';

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${sushi}" class="logo" alt="Discord" />
    <h1>Sushi Music</h1>
    <!-- Add a message input field -->
    <input class="inputfield" type="text" id="message" placeholder="Song name/link" />
    <!-- Add a send button -->
    <button class="send">Search</button>
      <div class="player">
          <img src="${nextSvg}" class="previous" alt="Previous" />
          <img src="${playSvg}" class="play" alt="Play" />
          <img src="${nextSvg}" class="next" alt="Next" />
      </div>
      <div class="volume">
          <img src="${volumeIcon}" class="volumeicon" alt="Volume" />
          <input type="range" class="volume" min="0" max="100" value="100" step="1">
      </div>
      <div class="progress-container">   
        <input type="range" class="progress" min="0" max="100" value="0" step="0.1">
        <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
      </div>
      <div class="playlist">
      </div>
      <button class="clear">Clear Queue</button>
  </div>
`;

// Ajoutez cette ligne juste avant la fin de votre code JavaScript existant
document.querySelector('.send').addEventListener('click', () => {
  addSong();
});

document.querySelector('.play').addEventListener('click', playSong);
document.querySelector('.pause').addEventListener('click', pauseSong);
document.querySelector('.restart').addEventListener('click', restartSong);
document.querySelector('.clear').addEventListener('click', clearQueue);

document.querySelector('.volume').addEventListener('input', updateVolume);
audio.addEventListener('timeupdate', updateProgress);