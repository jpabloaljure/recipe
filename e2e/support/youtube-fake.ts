/**
 * Fake YouTube IFrame Player API (add-autoplay-playback design Decision 7).
 *
 * The network guard in `test.ts` serves this script for
 * `https://www.youtube.com/iframe_api`, so the app's adapter runs unchanged and
 * the production build holds no test code. The fake keeps one object per
 * `YT.Player`, moves between states as the real player does (without its
 * timing) and registers everything in `window.__youTubeFake`, which
 * `player.ts` reads and drives from tests. Like the real player, `isMuted()` is
 * late: it shows the old value for 600 ms after an app mute or unmute. With
 * `blockUnmutedAutoplay` set, an
 * unmuted start does nothing and unmuting a playing video pauses it, as Chrome
 * does without permission.
 *
 * It can drift from the real API: real autoplay, loop, the player's own pause
 * control and blocked unmuted autoplay stay manual checks (AGENTS.md E2E rule 13).
 */
export const FAKE_IFRAME_API = `
(function () {
  var STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  var NAMES = { "-1": "unstarted", "0": "ended", "1": "playing", "2": "paused", "3": "buffering", "5": "cued" };
  // isMutedLagMs: the real player reports its muted state late, so isMuted() shows the old
  // value for this long after an app call to mute() or unMute().
  var fake = { players: [], blockUnmutedAutoplay: false, isMutedLagMs: 600, reportedMuted: null };
  window.__youTubeFake = fake;

  function Player(iframe, options) {
    var match = /\\/embed\\/([^?]+)/.exec(iframe.src);
    this.youtubeId = match ? decodeURIComponent(match[1]) : null;
    this.iframe = iframe;
    this.events = (options && options.events) || {};
    this.muted = false;
    this.shownMuted = false;
    this.mutedChangedAt = 0;
    this.mutedReads = 0;
    this.volume = 100;
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
    if (fake.blockUnmutedAutoplay && !this.muted) return; // an unmuted start is refused: nothing starts
    this._set(STATE.PLAYING);
  };
  Player.prototype.pauseVideo = function () {
    this.calls.push("pause");
    this._set(STATE.PAUSED);
  };
  Player.prototype._setMuted = function (value) {
    // The reported value is only replaced once the report has caught up with the last change.
    var catchingUp = fake.isMutedLagMs && Date.now() - this.mutedChangedAt < fake.isMutedLagMs;
    if (!catchingUp) this.shownMuted = this.muted;
    this.mutedChangedAt = Date.now();
    this.muted = value;
  };
  Player.prototype.mute = function () { this.calls.push("mute"); this._setMuted(true); };
  Player.prototype.unMute = function () {
    this.calls.push("unMute");
    this._setMuted(false);
    // Chrome pauses a playing video that is unmuted without permission.
    if (fake.blockUnmutedAutoplay && this.state === STATE.PLAYING) this._set(STATE.PAUSED);
  };
  Player.prototype.seekTo = function (seconds) { this.calls.push("seekTo(" + seconds + ")"); };
  Player.prototype.destroy = function () { this.calls.push("destroy"); this.destroyed = true; };
  Player.prototype.getVolume = function () { return this.volume; };
  Player.prototype.setVolume = function (volume) { this.calls.push("setVolume(" + volume + ")"); this.volume = volume; };
  Player.prototype.getPlayerState = function () { return this.state; };
  Player.prototype.isMuted = function () {
    this.mutedReads += 1;
    if (fake.reportedMuted !== null) return fake.reportedMuted; // a test makes the player report a fixed value
    if (fake.isMutedLagMs && Date.now() - this.mutedChangedAt < fake.isMutedLagMs) return this.shownMuted;
    return this.muted;
  };

  window.YT = { Player: Player, PlayerState: STATE };
  fake.stateName = function (code) { return NAMES[String(code)]; };
  if (typeof window.onYouTubeIframeAPIReady === "function") window.onYouTubeIframeAPIReady();
})();
`;
