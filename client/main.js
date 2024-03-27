import { DiscordSDK } from "@discord/embedded-app-sdk";

import rocketLogo from '/rocket.png';
import sushi from './sushi.png';
import playSvg from './play-svgrepo-com.svg';
import pauseSvg from './pause-svgrepo-com.svg';
import restartSvg from './restart-svgrepo-com.svg';
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

function searchSong() {
  const message = document.getElementById('message').value;
  console.log(message);
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


document.querySelector('#app').innerHTML = `
  <div>
    <img src="${sushi}" class="logo" alt="Discord" />
    <h1>Sushi Music</h1>
    <!-- Add a message input field -->
    <input class="inputfield" type="text" id="message" placeholder="Song name/link" />
    <!-- Add a send button -->
    <button class="send">Search</button>
      <div class="player">
        <img src="${playSvg}" class="play" alt="Play" />
        <img src="${pauseSvg}" class="pause" alt="Pause" />
        <img src="${restartSvg}" class="restart" alt="Restart" />
      </div>
      <div class="progress-container">   
        <input type="range" class="progress" min="0" max="100" value="0" step="0.1">
        <span class="current-time">0:00</span> / <span class="total-time">0:00</span>
      </div>
  </div>
`;

// Ajoutez cette ligne juste avant la fin de votre code JavaScript existant
document.querySelector('.send').addEventListener('click', searchSong);
document.querySelector('.play').addEventListener('click', playSong);
document.querySelector('.pause').addEventListener('click', pauseSong);
document.querySelector('.restart').addEventListener('click', restartSong);

audio.addEventListener('timeupdate', updateProgress);