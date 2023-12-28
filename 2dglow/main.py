from ursina import *

glow_shader = Shader(language=Shader.GLSL, 
                     vertex=open('glow_shader.vert').read(), 
                     fragment=open('glow_shader.frag').read(),
                     default_input={
                        "BLOOM_THRESHOLD" : 0.7,
                        "BLOOM_INTENSITY" : 3.0,
                        "BLUR_ITERATIONS" : 3,
                        "BLUR_SIZE" : 0.03,
                        "BLUR_SUBDIVISIONS" : 32                      
                     })

app = Ursina()

quad = Entity(model='quad', scale=10, texture='sample', shader=glow_shader)

EditorCamera()

slider = Slider(min=0, max=10, step=0.01, default=0.3, position=(-0.5, 0.4), parent=camera.ui)
slider2 = Slider(min=0, max=1, step=0.01, default=0.1, position=(-0.5, 0.44), parent=camera.ui)
slider3 = Slider(min=0, max=256, step=1, default=32, position=(-0.5, 0.36), parent=camera.ui)
slider4 = Slider(min=0, max=10, step=1, default=3, position=(-0.5, 0.32), parent=camera.ui)
slider5 = Slider(min=0, max=1, step=0.01, default=0.7, position=(-0.5, 0.28), parent=camera.ui)

def update():
    quad.set_shader_input("BLOOM_INTENSITY", slider.value)
    quad.set_shader_input("BLUR_SIZE", slider2.value)
    quad.set_shader_input("BLUR_SUBDIVISIONS", slider3.value)
    quad.set_shader_input("BLUR_ITERATIONS", slider4.value)
    quad.set_shader_input("BLOOM_THRESHOLD", slider5.value)

app.run()