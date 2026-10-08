/** three.js needs WebGL 2. The probe context is released at once. */
export const isWebGLAvailable = (): boolean => {
	try {
		const gl = document.createElement('canvas').getContext('webgl2');
		gl?.getExtension('WEBGL_lose_context')?.loseContext();
		return !!gl;
	} catch {
		return false;
	}
};
