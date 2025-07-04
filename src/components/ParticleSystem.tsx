import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleSystemProps {
  scene: THREE.Scene;
  position: THREE.Vector3;
  color: number;
  count: number;
}

class ParticleSystem {
  private scene: THREE.Scene;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private positions: Float32Array;
  private velocities: Float32Array;
  private life: Float32Array;
  private particleCount: number;

  constructor(scene: THREE.Scene, position: THREE.Vector3, color: number, count: number = 100) {
    this.scene = scene;
    this.particleCount = count;

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.life = new Float32Array(count);

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position
      this.positions[i3] = position.x + (Math.random() - 0.5) * 2;
      this.positions[i3 + 1] = position.y + (Math.random() - 0.5) * 2;
      this.positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
      
      // Velocity
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = Math.random() * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      
      // Life
      this.life[i] = Math.random();
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    // Create material
    this.material = new THREE.PointsMaterial({
      color: color,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    // Create points
    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  update() {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Update position
      this.positions[i3] += this.velocities[i3];
      this.positions[i3 + 1] += this.velocities[i3 + 1];
      this.positions[i3 + 2] += this.velocities[i3 + 2];
      
      // Update life
      this.life[i] -= 0.01;
      
      // Reset particle if dead
      if (this.life[i] <= 0) {
        this.positions[i3] = (Math.random() - 0.5) * 2;
        this.positions[i3 + 1] = (Math.random() - 0.5) * 2;
        this.positions[i3 + 2] = (Math.random() - 0.5) * 2;
        this.life[i] = 1;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.particles);
    this.geometry.dispose();
    this.material.dispose();
  }
}

export default ParticleSystem;