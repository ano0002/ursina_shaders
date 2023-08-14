from ursina import *

app = Ursina()

pixelart_shader = Shader(
    vertex = open('pixelart.vert').read(),
    fragment = open('pixelart.frag').read(),
    default_input = {
        'pixel_size': Vec2(10),
        'palette_size': 4,
        'resolution': window.size,
        "spread": 0.23,
        "gamma_correction": 2.2
    }
)
print(window.size)

car = Entity(model='pony_cartoon.glb',scale = 10)

cube = Entity(model='cube', texture="gradient" ,scale = 10)

EditorCamera(position = Vec3(0.0520753, 6, -6.87218),fov=5)

slider = Slider(min=0, max=1, step=0.01, default=0.23, position=(-.5, -.4), parent=camera.ui)
slider2 = Slider(min=0, max=1, step=0.01, default=2.2, position=(-.5, -.3), parent=camera.ui)

def update():
    camera.set_shader_input('spread', slider.value)
    camera.set_shader_input('gamma_correction', slider2.value)
    
camera.orthographic = True
camera.shader = pixelart_shader
    
app.run()