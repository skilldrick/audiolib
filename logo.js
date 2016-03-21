const logo = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  document.body.insertBefore(canvas, document.body.firstChild);
  const c = canvas.getContext('2d');

  const twoPi = Math.PI * 2;
  const logoSize = 100;
  const xOffset = 10;
  const yOffset = 10;
  const borderX = logoSize / 2 + xOffset;
  const borderY = logoSize / 2 + yOffset;
  const borderRadius = logoSize / 2;

  const sineColor = "#6f6";
  const backgroundColor = "#040";
  const borderColor = "#222";

  const sineWidth = 3;
  const sineShadowBlur = 10;
  const borderWidth = 6;

  const drawSine = (width, height, xOffset, yOffset) => {
    c.save();

    c.lineWidth = sineWidth;
    c.shadowColor = sineColor;
    c.shadowBlur = sineShadowBlur;
    c.strokeStyle = sineColor;

    c.beginPath();
    for (var i = 0; i < width; i++) {
      let x = i + xOffset;
      let y = -Math.sin((i / width) * twoPi) * height + height * 2 + yOffset;
      c.lineTo(x, y);
    }
    c.stroke();

    c.restore();
  };

  const drawCircle = (x, y, radius, shouldFill) => {
    c.beginPath();
    c.arc(borderX, borderY, borderRadius, 0, twoPi, false);
    shouldFill ? c.fill() : c.stroke();
  };

  c.lineWidth = borderWidth;
  c.fillStyle = backgroundColor;
  drawCircle(borderX, borderY, borderRadius, true);

  drawSine(logoSize, logoSize / 4, xOffset, yOffset);

  c.strokeStyle = borderColor;
  drawCircle(borderX, borderY, borderRadius, false);
};

module.exports = logo;
