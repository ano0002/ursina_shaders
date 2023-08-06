from ursina import *
import random


random.seed(1)


app = Ursina()

clouds_shader = Shader(language=Shader.GLSL,
                       vertex=open('clouds.vert').read(),
                       fragment=open('clouds.frag').read())


EditorCamera()


Entity(model="cube", texture="white_cube", color=color.red)
Sky(texture="sky_sunset.jpg")




sun = DirectionalLight(position = Vec3(3,2,1), color = color.gold, shadows = True)
sun.look_at(Vec3(0,0,0))



clouds = []

for _ in range(100):
    clouds.append(Entity(model = "sphere", scale=(10,2,5),y=10,shader = clouds_shader,x= random.randint(-100,100),z= random.randint(-100,100)))


for cloud in clouds:
    cloud.set_shader_input('brightness', 10)
    cloud.set_shader_input('amplitude', 0.3)
    cloud.set_shader_input("speed", 0.1)
    cloud.set_shader_input('light_direction', sun.rotation)
    cloud.set_shader_input('light_color', sun.color)


def update():
    for cloud in clouds:
        cloud.set_shader_input("camera_direction", camera.forward)



app.run()