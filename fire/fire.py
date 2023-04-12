from ursina import *

app = Ursina()

fire = Entity(model='cube', texture = "brick")

fire_shader = Shader(fragment=open("fire.frag").read())

fire.shader = fire_shader

start = time.time()

fire.set_shader_input("resolution",4)

EditorCamera()

app.run()