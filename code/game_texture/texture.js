class Texture {
    constructor(tex) {
        this.three = {};
        if (tex instanceof THREE.Texture) {
            this.three.texture = tex;
        } else if (typeof tex === "string") {
            this.three.texture = TextureLoader.get(tex);
        } else if (tex instanceof Texture) {
            this.three.texture = tex.three.texture;
        } else {
            throw new Error("[Texture] 错误的纹理参数");
        }

        this.pixelsPerUnit = this.three.texture.userData.pixelsPerUnit || 16; // 默认16像素=1单位
    }

    get width() {
        return this.three.texture.image.width;
    }

    get height() {
        return this.three.texture.image.height;
    }

    get repeat() {
        return this.three.texture.repeat;
    }

    set repeat(value) {
        this.three.texture.repeat.copy(value);
    }

    get offset() {
        return this.three.texture.offset;
    }

    set offset(value) {
        this.three.texture.offset.copy(value);
    }

    get source() {
        return this.three.texture.image;
    }

    set source(tex) {
        if (tex instanceof THREE.Texture) {
            this.three.texture = tex;
        } else if (tex instanceof Texture) {
            this.three.texture = tex.three.texture;
        } else {
            throw new Error("[Texture] 错误的纹理参数");
        }
    }

    dispose() {
        this.three.texture.dispose();
    }
}

export { Texture }