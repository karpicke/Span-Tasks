/**
 * Graphics Utility Class
 * 
 * Used for various plugins such as Spatial Recall and Symmetry Span
 * 
 * Andrew Arpasi
 */

class Graphics {
	static hexToRgb(hex) {
		const res = hex.match(/[a-f0-9]{2}/gi);
		return res && res.length === 3
		  ? res.map(function(v) { return parseInt(v, 16) })
		  : null;
	}

	/**
	 * Replace a color in an image with another color
	 * Mainly used to manage backgroud colors
	 * 
	 * @param {CanvasRenderingContext2D} ctx - Canvas context 
	 * @param {number} x - X pos of image
	 * @param {number} y - Y pos of image
	 * @param {number} width - Image width
	 * @param {number} height - Image height
	 * @param {string} oldColor - Color to be replaced
	 * @param {string} newColor - Color to replace with
	 * @param {number} tolerance - Tolerance for replacement (0 < t < 255)
	 * @param {number} alpha - New color alpha (0 < a < 255)
	 */
	static overwriteColor(ctx, x, y, width, height, oldColor, newColor, tolerance = 1, alpha = 255) {
		const imageData = ctx.getImageData(x, y, width, height);
		const pixels = imageData.data;
		const oldRGB = this.hexToRgb(oldColor);
		const newRGB = this.hexToRgb(newColor);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	pixels[k] >= oldRGB[0] - tolerance && 
				pixels[k+1] >= oldRGB[1] - tolerance && 
				pixels[k+2] >= oldRGB[2] - tolerance
			){
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = alpha;
			}
		}
		ctx.putImageData(imageData, x, y);
		return imageData
	}

	/**
	 * Draw an image on top of another, overlaying it and removing the background
	 * 
	 * @param {Function} imageDraw - Function to draw the image
	 * @param {CanvasRenderingContext2D} ctx - Canvas context 
	 * @param {number} x - X pos of image
	 * @param {number} y - Y pos of image
	 * @param {number} width - Image width
	 * @param {number} height - Image height
	 * @param {string} replaceColor - Color to be replaced
	 * @param {number} tolerance - Tolerance for replacement (0 < t < 255)
	 */
	static drawImageOverlay(imageDraw, ctx, x, y, width, height, replaceColor, tolerance = 0) {
		const originalData = ctx.getImageData(x, y, width, height);
		const origPixels = originalData.data;
		imageDraw()
		const imageData = ctx.getImageData(x, y, width, height);
		const pixels = imageData.data;
		const oldRGB = this.hexToRgb(replaceColor);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	pixels[k] >= oldRGB[0] - tolerance && 
				pixels[k+1] >= oldRGB[1] - tolerance && 
				pixels[k+2] >= oldRGB[2] - tolerance
			){
				pixels[k] = origPixels[k];
				pixels[k+1] = origPixels[k+1];
				pixels[k+2] = origPixels[k+2];
				pixels[k+3] = origPixels[k+3];
			}
		}
		ctx.putImageData(imageData, x, y);
		return imageData
	}

	static detectGridArea(x, y, length) {
		return {
			row: parseInt(Math.floor((y/length) % length)),
			col: parseInt(Math.floor((x/length) % length))
		}
	}

	static getCellData(ctx, row, col, length) {
		const originalData = ctx.getImageData(col * length, row * length, length, length);
		return originalData;
    }
    
    static drawGrid(ctx, rows, cols, gridLength, color, thickness) {
        let cellHeight = gridLength / rows;
        let cellWidth = gridLength / cols;
        const edgeOffset = thickness / 2;
        for(let row = 0; row <= rows; row++) {
            ctx.beginPath();
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.moveTo(0,(row * cellHeight) + edgeOffset);
            ctx.lineTo(gridLength + edgeOffset * 2, (row * cellHeight) + edgeOffset);
            ctx.stroke();
        }
        for(let col = 0; col <= cols; col++) {
            ctx.beginPath();
            ctx.lineWidth = thickness;
            ctx.strokeStyle = color;
            ctx.moveTo((col * cellWidth) + edgeOffset, 0);
            ctx.lineTo((col * cellWidth) + edgeOffset, gridLength + edgeOffset * 2);
            ctx.stroke();
        }
    }

    static fillCell(ctx, row, col, color, cellLength, borderOffset = 0) {
        const cellX = col * cellLength;
        const cellY = row * cellLength;
        console.log(`row: ${row} col: ${col}`)
        ctx.fillStyle = color
        ctx.fillRect(cellX + (borderOffset), cellY + (borderOffset), cellLength - (borderOffset), cellLength - (borderOffset));
    }

    static cellText(ctx, row, col, text, cellLength, font, color) {
        // use canvas measureText() method
        ctx.font = font;
        ctx.fillStyle = color
        const textWidth = ctx.measureText(text).width
        const textHeight = parseInt(font.split(' ')[0]);
        console.log("Text width",textWidth,"Text height",textHeight)
        const cellCenterX = (col * cellLength) + (cellLength / 2) - (textWidth / 2);
        const cellCenterY = (row * cellLength) + (cellLength / 2) + (textHeight / 2);

        ctx.fillText(text, cellCenterX, cellCenterY); 
    }

	static drawCellBorder(ctx, row, col, length, color, thickness) {
		const originalData = ctx.getImageData(col * length, row * length, length, length);
		const imageData = ctx.getImageData(col * length, row * length, length, length);
		const pixels = imageData.data;
		const newRGB = this.hexToRgb(color);
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			// top
			if((k / 4) <= thickness * length) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			// bottom
			if((pixels.length / 4) - (k / 4) <= thickness * length) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			//left side
			if((k / 4) % length <= thickness) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
			// right side
			if(((pixels.length / 4) - (k / 4)) % length <= thickness) {
				pixels[k] = newRGB[0];
				pixels[k+1] = newRGB[1];
				pixels[k+2] = newRGB[2];
				pixels[k+3] = 255;
			}
		}
		ctx.putImageData(imageData, col * length, row * length);
		return originalData;
	}

	static restoreCell(ctx, row, col, length, original) {
		const origPixels = original.data;
		const imageData = ctx.getImageData(col * length, row * length, length, length);
		const pixels = imageData.data;
		for (let k = 0, n = pixels.length; k < n; k += 4) {
			if(	origPixels[k] != pixels[k]) {
				pixels[k] = origPixels[k];
				pixels[k+1] = origPixels[k+1];
				pixels[k+2] = origPixels[k+2];
				pixels[k+3] = origPixels[k+3];
			}
		}
		ctx.putImageData(imageData, col * length, row * length);
	}
}

module.exports = Graphics