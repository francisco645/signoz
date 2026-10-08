import { CanvasTexture, LinearFilter, Sprite, SpriteMaterial } from 'three';

interface TextSpriteOptions {
	size?: number;
	color: string;
	halo: string;
	weight?: number;
	font?: string;
	/** Scene units per CSS pixel of the text. */
	scale?: number;
}

const PIXEL_RATIO = 2;
const PADDING = 10;

/** Text drawn on a canvas and shown as a sprite, so it always faces the camera. */
export const createTextSprite = (
	text: string,
	{
		size = 26,
		color,
		halo,
		weight = 500,
		font = 'Inter',
		scale = 0.16,
	}: TextSpriteOptions,
): Sprite => {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	const fontSpec = `${weight} ${size * PIXEL_RATIO}px ${font}, system-ui, sans-serif`;
	if (ctx) {
		ctx.font = fontSpec;
		canvas.width = Math.ceil(
			ctx.measureText(text).width + PADDING * 2 * PIXEL_RATIO,
		);
		canvas.height = Math.ceil(size * PIXEL_RATIO * 1.5);
		ctx.font = fontSpec;
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.lineWidth = 5 * PIXEL_RATIO;
		ctx.lineJoin = 'round';
		ctx.strokeStyle = halo;
		ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
		ctx.fillStyle = color;
		ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	}

	const texture = new CanvasTexture(canvas);
	texture.anisotropy = 4;
	texture.minFilter = LinearFilter;
	const sprite = new Sprite(
		new SpriteMaterial({
			map: texture,
			transparent: true,
			depthWrite: false,
			fog: false,
		}),
	);
	sprite.scale.set(
		(canvas.width / PIXEL_RATIO) * scale,
		(canvas.height / PIXEL_RATIO) * scale,
		1,
	);
	return sprite;
};
