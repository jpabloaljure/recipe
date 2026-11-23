/**
 * Fake YouTube IFrame Player API (add-autoplay-playback design Decision 7).
 *
 * The network guard in `test.ts` serves this script for
 * `https://www.youtube.com/iframe_api`, so the app's adapter runs unchanged and
 * the production build holds no test code. The fake keeps one object per
 * `YT.Player`, moves between states as the real player does (without its
 * timing) and registers everything in `window.__youTubeFake`, which
 * `player.ts` reads and drives from tests.
 *
 * It can drift from the real API: real autoplay, loop, the player's own pause
 * control and blocked unmuted autoplay stay manual checks (AGENTS.md E2E rule 13).
 */
export const FAKE_IFRAME_API = `
(function () {
  var STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  var NAMES = { "-1": "unstarted", "0": "ended", "1": "playing", "2": "paused", "3": "buffering", "5": "cued" };
  var fake = { players: [], blockUnmutedAutoplay: false };
  window.__youTubeFake = fake;

  function Player(iframe, options) {
    var match = /\\/embed\\/([^?]+)/.exec(iframe.src);
    this.youtubeId = match ? decodeURIComponent(match[1]) : null;
    this.iframe = iframe;
    this.events = (options && options.events) || {};
    this.muted = false;
    this.state = STATE.UNSTARTED;
    this.calls = [];
    this.destroyed = false;
    fake.players.push(this);
    var self = this;
    Promise.resolve().then(function () {
      if (!self.destroyed && self.events.onReady) self.events.onReady({ target: self });
    });
  }
  Player.prototype._set = function (state) {
    if (this.destroyed || this.state === state) return;
    this.state = state;
    if (this.events.onStateChange) this.events.onStateChange({ data: state, target: this });
  };
  Player.prototype.playVideo = function () {
    this.calls.push("play");
    if (fake.blockUnmutedAutoplay && !this.muted) return; // the browser refuses: nothing starts
    this._set(STATE.PLAYING);
  };
  Player.prototype.pauseVideo = function () {
    this.calls.push("pause");
    this._set(STATE.PAUSED);
  };
  Player.prototype.mute = function () { this.calls.push("mute"); this.muted = true; };
  Player.prototype.unMute = function () { this.calls.push("unMute"); this.muted = false; };
  Player.prototype.seekTo = function (seconds) { this.calls.push("seekTo(" + seconds + ")"); };
  Player.prototype.destroy = function () { this.calls.push("destroy"); this.destroyed = true; };
  Player.prototype.getPlayerState = function () { return this.state; };
  Player.prototype.isMuted = function () { return this.muted; };

  window.YT = { Player: Player, PlayerState: STATE };
  fake.stateName = function (code) { return NAMES[String(code)]; };
  if (typeof window.onYouTubeIframeAPIReady === "function") window.onYouTubeIframeAPIReady();
})();
`;
