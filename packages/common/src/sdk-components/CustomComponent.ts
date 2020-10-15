import { Object3D, VideoTexture } from "three";

import {
  SceneComponent,
  ComponentInteractionType,
  ComponentOutput,
} from "../SceneComponent";

type Inputs = {
  /**
   * A device id returned by a call to `navigator.mediaDevices.enumerateDevices()` or null to use the default video input source
   */
  deviceId: string | null;

  enabled: boolean;
};

type Outputs = {
  /**
   * A `MediaStream` object ready for use in the `VideoRenderer`
   */
  stream: MediaStream;
  /**
   * The aspect ratio of the first video track of the `stream`. Useful in maintaining the proportion when rendered to a `TextureRenderer`
   */
  aspect: number;
} & ComponentOutput;

class CustomComponent extends SceneComponent {
  private root: Object3D | null = null;
  private cube: THREE.Mesh | null = null;
  private video: HTMLVideoElement;

  inputs: Inputs = {
    deviceId: null,
    enabled: false,
  };

  outputs = {
    stream: null,
    aspect: 1,
  } as Outputs;

  events = {
    [ComponentInteractionType.CLICK]: true,
  };

  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.setAttribute("width", "720");
    video.setAttribute("height", "480");
    video.volume = 0.1;
    return video;
  }

  onInit() {
    const THREE = this.context.three;
    this.root = new THREE.Object3D();
    this.outputs.objectRoot = this.root;
    this.outputs.collider = this.root;

    var geometry = new THREE.PlaneGeometry(1.42, 0.78);

    this.video = this.createVideoElement();

    const texture = new THREE.TextureLoader().load( "/assets/video call.png" );

    var material = new THREE.MeshBasicMaterial({
      map: texture
    });

    this.cube = new THREE.Mesh(geometry, material);

    this.root.add(this.cube);

    this.outputs.objectRoot = this.root;
  }

  onTick(delta: number) {
    //this.cube.rotateX(0.001);
    //this.cube.rotateY(0.01);
  }

  onInputsUpdated(oldInputs: Inputs) {
    if (!this.inputs.enabled) {
      this.destroyOutputStream();
      return;
    }

    if (oldInputs.deviceId !== this.inputs.deviceId) {
      this.destroyOutputStream();
    }

    this.setupStream();
  }

  onEvent(eventType: string): void {
    console.log(eventType);

    if (eventType === ComponentInteractionType.CLICK) {
      this.setupStream();
    }
  }

  private setupStream() {
    // otherwise, fallback to the default video device
    this.updateVideoDevice({ video: true });
  }

  onDestroy() {
    this.destroyOutputStream();
  }

  private async updateVideoDevice(constraints: MediaStreamConstraints) {
    const source = await navigator.mediaDevices.getUserMedia(constraints);

    this.video.srcObject = source;
    this.video.play();

    (this.cube.material as THREE.MeshBasicMaterial).map = new VideoTexture(this.video);

    /*
    const videoTrack = source.getVideoTracks()[0];
    if (videoTrack) {
      this.outputs.stream = source;
      const videoSettings = videoTrack.getSettings();
      this.outputs.aspect = videoSettings.aspectRatio;
    }
    */
  }

  private destroyOutputStream() {
    const stream = this.outputs.stream;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }

      this.outputs.stream = null;
    }
  }
}

export interface ICustomComponent extends SceneComponent {
  inputs: Inputs;
  outputs: Outputs;
}

export const customComponentType = "mp.customComponent";
export function makeCustomComponent() {
  return new CustomComponent();
}
