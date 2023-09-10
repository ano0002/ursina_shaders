from ursina import *

# Setting up the scene

app = Ursina()

random.seed(0)
ground = Entity(model='plane', collider='box', scale=64, texture='grass', texture_scale=(4,4))

editor_camera = EditorCamera(enabled=True, ignore_paused=True)


for i in range(16):
    Entity(model='cube', origin_y=-.5, scale=2, texture='brick', texture_scale=(1,2),
        x=random.uniform(-8,8),
        z=random.uniform(-8,8) + 8,
        collider='box',
        scale_y = random.uniform(2,3),
        color=color.hsv(0, 0, random.uniform(.9, 1))
        )


sun = DirectionalLight(color=color.white)
sun.look_at(Vec3(1,-1,1))

# Shader

clouds_shader = Shader(language=Shader.GLSL,
                       vertex=open('clouds.vert').read(),
                       fragment=open('clouds.frag').read(),
                       default_input= {
                           "aspect_ratio" : camera.aspect_ratio,
                           "cloud_height" : 1,
                           "threshold" : 0.7,
                           "sky_height" : 15,
                           "density" : -0.45,
                           "cloud_scale" : 10,
                           "wind_speed" : Vec2(0.1),
                          }
                       )


slider = Slider(min=-1, max=1, step=0.01, default=-0.45, position=(-.5, -.4), parent=camera.ui)
slider2 = Slider(min=1, max=100, step=0.01, default=10, position=(-.5, -.3), parent=camera.ui)

camera.shader = clouds_shader

camera.set_shader_input("light_color", sun.color)
camera.set_shader_input("ambient_strength", 0.3)
camera.set_shader_input("background_tex", load_texture("sky_sunset"))
camera.set_shader_input("window_size", window.size)

def update():
    camera.set_shader_input("camera_pos",camera.world_position)
    camera.set_shader_input("camera_forward",camera.forward)
    camera.set_shader_input("camera_right",camera.right)
    camera.set_shader_input("camera_up",camera.up)
    sun.look_at(Vec3(sin(time.time()),-1,cos(time.time())))
    camera.set_shader_input("light_dir", sun.forward)
    camera.set_shader_input("density", slider.value)
    camera.set_shader_input("cloud_scale", slider2.value)
    
app.run()