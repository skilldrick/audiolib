export default (el, size) => {
  const canvas = document.createElement('canvas');

  const logoSize = size || 100;
  const xOffset = logoSize / 20;
  const yOffset = logoSize / 20;

  canvas.width = logoSize + 2 * xOffset;
  canvas.height = logoSize + 2 * yOffset;

  (el || document.body).appendChild(canvas);
  const c = canvas.getContext('2d');

  const twoPi = Math.PI * 2;
  const borderX = logoSize / 2 + xOffset;
  const borderY = logoSize / 2 + yOffset;
  const borderRadius = logoSize / 2;

  const sineColor = "#6f6";
  const backgroundColor = "#040";
  const borderColor = "#222";

  const sineWidth = logoSize / 30;
  const sineShadowBlur = logoSize / 10;
  const borderWidth = logoSize / 16;

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
