import * as THREE from "three";
import React, { forwardRef, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { useFloatingBar } from "@/layout/FloatingBar";

import { Grabbable } from "@/physics/Grabbable";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";

type GLTFResult = GLTF & {
  nodes: {
    Square_Dualshock_Blue_0: THREE.Mesh;
    Triangle_Dualshock_Blue_0: THREE.Mesh;
    Cross_Dualshock_Blue_0: THREE.Mesh;
    Circle_Dualshock_Blue_0: THREE.Mesh;
    R3_Dualshock_Blue_0: THREE.Mesh;
    RightStickBase_Dualshock_Blue_0: THREE.Mesh;
    RightTriggerBase_Dualshock_Blue_0: THREE.Mesh;
    R1_Dualshock_Blue_0: THREE.Mesh;
    R2_Dualshock_Blue_0: THREE.Mesh;
    RightSideBase_Dualshock_Blue_0: THREE.Mesh;
    Up_Dualshock_Blue_0: THREE.Mesh;
    Down_Dualshock_Blue_0: THREE.Mesh;
    Right_Dualshock_Blue_0: THREE.Mesh;
    Left_Dualshock_Blue_0: THREE.Mesh;
    L3_Dualshock_Blue_0: THREE.Mesh;
    LeftStickBase_Dualshock_Blue_0: THREE.Mesh;
    LeftTriggerBase_Dualshock_Blue_0: THREE.Mesh;
    L1_Dualshock_Blue_0: THREE.Mesh;
    L2_Dualshock_Blue_0: THREE.Mesh;
    LeftSideBase_Dualshock_Blue_0: THREE.Mesh;
    CenterBase_Dualshock_Blue_0: THREE.Mesh;
    Analog_Dualshock_Blue_0: THREE.Mesh;
    Select_Dualshock_Blue_0: THREE.Mesh;
    Start_Dualshock_Blue_0: THREE.Mesh;
  };
  materials: {
    Dualshock_Blue: THREE.MeshBasicMaterial;
  };
};

const PATH = "gltf/ps-controller.glb";

interface Props {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const PSControllerModel = forwardRef(
  ({ scale = [1, 1, 1], ...props }: Props, ref: any) => {
    const api = useRef<RapierRigidBody>(null);

    const { nodes, materials } = useGLTF(PATH) as GLTFResult;
    const { setHoveredObject } = useFloatingBar();

    const handlePointerEnter = (e: any) => {
      e.stopPropagation();

      setHoveredObject({
        title: "Retro Videospiele",
      });
    };

    const handlePointerLeave = () => {
      setHoveredObject(null);
    };

    return (
      <Grabbable rigidBodyRef={api} mode={"spring"}>
        <RigidBody
          {...props}
          ref={api}
          colliders="hull"
          restitution={0.5}
          friction={0.7}
        >
          <group
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
          >
            <group name="Sketchfab_Scene">
              <group
                name="Sketchfab_model"
                rotation={[-Math.PI / 2, 0, Math.PI]}
                scale={0.2}
              >
                <group
                  name="02b8b04a84f444f58559ae046d9e9522fbx"
                  rotation={[Math.PI / 2, 0, 0]}
                  scale={0.01}
                >
                  <group name="Object_2">
                    <group name="RootNode">
                      <group name="Dualshock" position={[0, 0, 6.25]}>
                        <group name="RightSide" position={[-87.5, 0, 31.25]}>
                          <group name="Buttons">
                            <group name="Square">
                              <mesh
                                name="Square_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.Square_Dualshock_Blue_0.geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="Triangle">
                              <mesh
                                name="Triangle_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.Triangle_Dualshock_Blue_0.geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="Cross">
                              <mesh
                                name="Cross_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.Cross_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="Circle">
                              <mesh
                                name="Circle_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.Circle_Dualshock_Blue_0.geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="RightStick">
                            <group name="R3">
                              <mesh
                                name="R3_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.R3_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="RightStickBase">
                              <mesh
                                name="RightStickBase_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.RightStickBase_Dualshock_Blue_0.geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="RightTrigger">
                            <group name="RightTriggerBase">
                              <mesh
                                name="RightTriggerBase_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.RightTriggerBase_Dualshock_Blue_0
                                    .geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="R1" position={[87.5, 0, -25]}>
                              <mesh
                                name="R1_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.R1_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group
                              name="R2"
                              position={[0, -31.25, 43.75]}
                              rotation={[0.175, 0, 0]}
                            >
                              <mesh
                                name="R2_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.R2_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="RightSideBase">
                            <mesh
                              name="RightSideBase_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={
                                nodes.RightSideBase_Dualshock_Blue_0.geometry
                              }
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                        </group>
                        <group name="LeftSide" position={[0, 0, 31.25]}>
                          <group name="DPad" position={[87.5, 9.375, -25]}>
                            <group name="Up">
                              <mesh
                                name="Up_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.Up_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group
                              name="Down"
                              rotation={[-Math.PI, 0, -Math.PI]}
                            >
                              <mesh
                                name="Down_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.Down_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="Right" rotation={[0, -Math.PI / 2, 0]}>
                              <mesh
                                name="Right_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.Right_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="Left" rotation={[0, Math.PI / 2, 0]}>
                              <mesh
                                name="Left_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.Left_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="LeftStick" position={[87.5, 0, 0]}>
                            <group name="L3">
                              <mesh
                                name="L3_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.L3_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="LeftStickBase">
                              <mesh
                                name="LeftStickBase_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.LeftStickBase_Dualshock_Blue_0.geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="LeftTrigger" position={[87.5, 0, 0]}>
                            <group name="LeftTriggerBase">
                              <mesh
                                name="LeftTriggerBase_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={
                                  nodes.LeftTriggerBase_Dualshock_Blue_0
                                    .geometry
                                }
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group name="L1" position={[-87.5, 0, -25]}>
                              <mesh
                                name="L1_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.L1_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                            <group
                              name="L2"
                              position={[0, -31.25, 43.75]}
                              rotation={[0.175, 0, 0]}
                            >
                              <mesh
                                name="L2_Dualshock_Blue_0"
                                castShadow
                                receiveShadow
                                geometry={nodes.L2_Dualshock_Blue_0.geometry}
                                material={materials.Dualshock_Blue}
                              />
                            </group>
                          </group>
                          <group name="LeftSideBase" position={[87.5, 0, 0]}>
                            <mesh
                              name="LeftSideBase_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={
                                nodes.LeftSideBase_Dualshock_Blue_0.geometry
                              }
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                        </group>
                        <group name="Center" position={[0, 0, 6.25]}>
                          <group name="CenterBase">
                            <mesh
                              name="CenterBase_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={
                                nodes.CenterBase_Dualshock_Blue_0.geometry
                              }
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                          <group name="Analog">
                            <mesh
                              name="Analog_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={nodes.Analog_Dualshock_Blue_0.geometry}
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                          <group name="Select">
                            <mesh
                              name="Select_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={nodes.Select_Dualshock_Blue_0.geometry}
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                          <group name="Start">
                            <mesh
                              name="Start_Dualshock_Blue_0"
                              castShadow
                              receiveShadow
                              geometry={nodes.Start_Dualshock_Blue_0.geometry}
                              material={materials.Dualshock_Blue}
                            />
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </RigidBody>
      </Grabbable>
    );
  },
);

useGLTF.preload(PATH);
