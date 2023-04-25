from ursina import *
import random

app = Ursina()

vignetting_shader = Shader(fragment=open("fireflies.frag").read(),
default_input={
    "points" : [Vec2(random.random(), random.random()) for i in range(100)],
    "fireflies_color" : Vec4(0,1,0,1),
    "camera_position" : Vec3(0,0,0),
    "fireflies_size" : 0.005
})

e = Entity(model='sphere', color=color.yellow)
e = Entity(model='cube', y=-1)
camera.shader = vignetting_shader

def update():
    if held_keys["a"]:
        camera.x -= 1 * time.dt
    if held_keys["d"]:
        camera.x += 1 * time.dt
    if held_keys["w"]:
        camera.y += 1 * time.dt
    if held_keys["s"]:
        camera.y -= 1 * time.dt
    
    camera.set_shader_input("camera_position", camera.position)

app.run()