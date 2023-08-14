from ursina import *
import time

app = Ursina()
lighting_shader=Shader(vertex = open('lighting.vert').read(),
    fragment = open('lighting.frag').read(),
    default_input = {
        #Default_inputs
    }
)

cube = Entity(model=Plane(subdivisions=(100,100)), texture = "albedo.jpg", scale=2, rotation_x= -90, shader=lighting_shader)


sun = PointLight(position=Vec3(cos(time.time()),3,sin(time.time())))

light_indicator = Entity(model="sphere", color = color.yellow, scale=0.1, parent=sun)

cube.set_shader_input("normal_map",load_texture("normal"))
cube.set_shader_input("height_map",load_texture("height"))
cube.set_shader_input("roughness_map",load_texture("roughness"))

EditorCamera()

slider = Slider(min=0, max=1, step=0.01, default=0.15, dynamic=True, position=(-0.5,0.4))

def update():
    sun.position = Vec3(cos(time.time()),3,sin(time.time()))
    cube.set_shader_input("light_pos",sun.world_position)
    cube.set_shader_input("height_scale",slider.value)
    cube.set_shader_input("camera_pos",camera.world_position)
    cube.set_shader_input("light_color",sun.color)
app.run()