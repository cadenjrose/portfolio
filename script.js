// Step-response demo: a PI controller driving a first-order motor model.
(function () {
  var canvas = document.getElementById("scope-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var kpInput = document.getElementById("kp");
  var kiInput = document.getElementById("ki");
  var kpOut = document.getElementById("kp-out");
  var kiOut = document.getElementById("ki-out");
  var readout = document.getElementById("scope-readout");

  var DURATION = 3;      // seconds simulated
  var DT = 0.002;        // simulation step
  var STEP_AT = 0.2;     // setpoint steps from 0 to 1 here
  var TAU = 0.35;        // motor time constant
  var U_MAX = 2;         // actuator limit (think: bridge voltage)

  function simulate(kp, ki) {
    var y = 0, integral = 0, samples = [];
    for (var t = 0; t <= DURATION; t += DT) {
      var setpoint = t < STEP_AT ? 0 : 1;
      var error = setpoint - y;
      var u = kp * error + ki * integral;
      var uClamped = Math.max(0, Math.min(U_MAX, u));
      // Anti-windup: only integrate while the actuator is not saturated
      if (u === uClamped) integral += error * DT;
      y += (DT * (uClamped - y)) / TAU;
      samples.push({ t: t, y: y });
    }
    return samples;
  }

  function measure(samples) {
    var peak = 0, lastOutside = -1, i;
    for (i = 0; i < samples.length; i++) {
      if (samples[i].y > peak) peak = samples[i].y;
      if (samples[i].t >= STEP_AT && Math.abs(samples[i].y - 1) > 0.02) lastOutside = i;
    }
    var overshoot = Math.max(0, (peak - 1) * 100);
    var settled = lastOutside < samples.length - 1;
    var settleTime = lastOutside < 0 ? 0 : samples[lastOutside].t - STEP_AT;
    return { overshoot: overshoot, settled: settled, settleTime: settleTime };
  }

  function draw() {
    var kp = parseFloat(kpInput.value);
    var ki = parseFloat(kiInput.value);
    kpOut.textContent = kp.toFixed(1);
    kiOut.textContent = ki.toFixed(1);

    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var pad = { l: 12, r: 12, t: 14, b: 14 };
    var yMax = 1.6;
    function X(t) { return pad.l + (t / DURATION) * (w - pad.l - pad.r); }
    function Y(v) { return h - pad.b - (v / yMax) * (h - pad.t - pad.b); }

    ctx.fillStyle = "#0b1511";
    ctx.fillRect(0, 0, w, h);

    // Graticule
    ctx.strokeStyle = "#1d3a2e";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 0; gx <= DURATION; gx += 0.5) { ctx.moveTo(X(gx), pad.t); ctx.lineTo(X(gx), h - pad.b); }
    for (var gy = 0; gy <= yMax; gy += 0.4) { ctx.moveTo(pad.l, Y(gy)); ctx.lineTo(w - pad.r, Y(gy)); }
    ctx.stroke();

    // 2% settling band
    ctx.fillStyle = "rgba(255, 205, 0, 0.12)";
    ctx.fillRect(X(STEP_AT), Y(1.02), X(DURATION) - X(STEP_AT), Y(0.98) - Y(1.02));

    // Setpoint
    ctx.strokeStyle = "#ffcd00";
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    ctx.lineTo(X(STEP_AT), Y(0));
    ctx.lineTo(X(STEP_AT), Y(1));
    ctx.lineTo(X(DURATION), Y(1));
    ctx.stroke();
    ctx.setLineDash([]);

    // Response
    var samples = simulate(kp, ki);
    ctx.strokeStyle = "#7fe0b0";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (var i = 0; i < samples.length; i += 5) {
      var px = X(samples[i].t), py = Y(Math.min(samples[i].y, yMax));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    var m = measure(samples);
    var parts = ["Overshoot " + m.overshoot.toFixed(0) + "%"];
    parts.push(m.settled ? "settles in " + m.settleTime.toFixed(2) + " s" : "does not settle within " + (DURATION - STEP_AT).toFixed(1) + " s");
    readout.textContent = parts.join(", ");
  }

  kpInput.addEventListener("input", draw);
  kiInput.addEventListener("input", draw);
  window.addEventListener("resize", draw);
  draw();
})();