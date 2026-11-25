'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { TIERS } from '@/lib/tiers'
import type { ResultItem } from '@/lib/client-types'

const RX = 12
const RZ = 8
const MISS_COLOR = 'var(--tier-miss)'

function cssColor(value: string): string {
  const match = value.match(/var\((--[\w-]+)\)/)
  if (!match) return value
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim() || '#ffffff'
}

function flat(mesh: THREE.Mesh, scaleX: number, scaleZ: number) {
  mesh.rotation.x = -Math.PI / 2
  mesh.scale.set(scaleX, scaleZ, 1)
}

/** A top-down-ish 3D view of the innings: one shot per answer, from the batter. */
export default function InningsScene({ results }: { results: ResultItem[] }) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.set(0, 8.5, 24)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.8))
    const sun = new THREE.DirectionalLight(0xffffff, 1.1)
    sun.position.set(-6, 14, 8)
    scene.add(sun)

    const stripes = document.createElement('canvas')
    stripes.width = 512
    stripes.height = 64
    const ctx = stripes.getContext('2d')
    if (ctx) {
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = i % 2 ? '#2f7d3f' : '#297036'
        ctx.fillRect(i * 32, 0, 32, 64)
      }
    }
    const grassTexture = new THREE.CanvasTexture(stripes)
    grassTexture.colorSpace = THREE.SRGBColorSpace

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 1 }),
    )
    flat(ground, RX, RZ)
    scene.add(ground)

    const boundary = new THREE.Mesh(
      new THREE.RingGeometry(0.965, 1, 128),
      new THREE.MeshBasicMaterial({ color: '#d9ef6b', side: THREE.DoubleSide }),
    )
    flat(boundary, RX, RZ)
    boundary.position.y = 0.02
    scene.add(boundary)

    const inner = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.43, 96),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      }),
    )
    flat(inner, RX, RZ)
    inner.position.y = 0.015
    scene.add(inner)

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 2.6),
      new THREE.MeshStandardMaterial({ color: '#c9a877', roughness: 0.9 }),
    )
    pitch.rotation.x = -Math.PI / 2
    pitch.position.y = 0.03
    scene.add(pitch)

    const batter = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 12),
      new THREE.MeshStandardMaterial({ color: '#f3eee0', emissive: '#f3eee0', emissiveIntensity: 0.3 }),
    )
    batter.position.y = 0.2
    scene.add(batter)

    results.forEach((result, index) => {
      const six = result.score >= 100
      const jitter = Math.sin((index + 1) * 12.9898) * 43758.5453
      const spread = jitter - Math.floor(jitter)
      const angle = six ? Math.PI / 2 + ((index % 3) - 1) * 0.3 : spread * 2 * Math.PI
      const ux = Math.cos(angle)
      const uz = Math.sin(angle)
      const toRope = 1 / Math.sqrt((ux / RX) ** 2 + (uz / RZ) ** 2)
      const boundary = result.score >= 85
      const reach = six || boundary ? toRope : toRope * (0.15 + (result.score / 100) * 0.8)
      const ex = ux * reach
      const ez = uz * reach
      const color = cssColor(result.tier ? TIERS[result.tier].color : MISS_COLOR)
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
      })

      const start = new THREE.Vector3(0, 0.05, 0)
      const end = new THREE.Vector3(ex, 0.05, ez)
      const curve = six
        ? new THREE.QuadraticBezierCurve3(start, new THREE.Vector3(ex / 2, 7, ez / 2), end)
        : new THREE.LineCurve3(start, end)

      const radius = 0.06 + (result.score / 100) * 0.05
      const trail = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 8, false), material)
      scene.add(trail)

      const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.2, 16, 12), material)
      tip.position.copy(end)
      scene.add(tip)
    })

    const resize = () => {
      const width = mount.clientWidth
      const height = Math.round(width * 0.62)
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()

    return () => {
      observer.disconnect()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      grassTexture.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [results])

  return (
    <div className="shotmap">
      <div className="shotmap-title">
        Wagon wheel <span>· longer shot = rarer answer</span>
      </div>
      <div className="scene-wrap">
        <div className="scene-canvas" ref={mountRef} />
        <span className="scene-label scene-leg">LEG SIDE</span>
        <span className="scene-label scene-off">OFF SIDE</span>
      </div>
    </div>
  )
}
