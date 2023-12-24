from ursina import *
import math


app = Ursina()

outline_shader = Shader(
    fragment = open('outline.frag').read(),
    default_input = {
        'outline_size': 0.003,
        'aspect_ratio': window.aspect_ratio
    }
)

cellshading_shader = Shader(
    vertex= open('cellshading.vert').read(),
    fragment = open('cellshading.frag').read(),
    default_input = {
        'avg_precision' : 5,
        "brightness" : 1,
        "atmosphere_light" : 0.5,
        "palette_size" : 2,
        "light_direction" : Vec3(0,-1,0),
    }
)


car = Entity(model='pony_cartoon.glb',scale = 10,shader=cellshading_shader)
car.set_shader_input("brightness", 5)


sphere = Entity(model="sphere", texture="gradient",position = Vec3(-10,-1,30) ,scale = 5,shader=cellshading_shader)

EditorCamera(position = Vec3(0.0520753, 6, -6.87218),fov=5)

slider = Slider(min=0, max=10, step=0.01, default=3, position=(-.5, -.4), parent=camera.ui)
slider2 = Slider(min=1, max=10, step=1, default=2, position=(-.5, -.45), parent=camera.ui)

light = DirectionalLight()

total_time = 0


def update():
    global total_time
    total_time += time.dt
    camera.set_shader_input('outline_size', slider.value/1000)
    car.set_shader_input("palette_size", slider2.value)
    sphere.set_shader_input("palette_size", slider2.value)
    car.set_shader_input("light_direction", Vec3(math.sin(total_time), -1,math.cos(total_time)))
    sphere.set_shader_input("light_direction", Vec3(math.sin(total_time), -1,math.cos(total_time)))
    

camera.shader = outline_shader
    
app.run()