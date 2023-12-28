from ursina import *
import math
import numpy as np

TrailShader = Shader(language=Shader.GLSL, fragment=open('trail.frag').read(),
                     default_input={
                        "thickness": 0.6,
                        "density": 9,
                        "vein_color": Vec4(0,0,0,1)
                     })

def rotation_matrix_from_vectors(vec1, vec2):
    a, b = (vec1 / np.linalg.norm(vec1)).reshape(3), (vec2 / np.linalg.norm(vec2)).reshape(3)
    v = np.cross(a, b)
    c = np.dot(a, b)
    s = np.linalg.norm(v)
    kmat = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    rotation_matrix = np.eye(3) + kmat + kmat.dot(kmat) * ((1 - c) / (s ** 2))
    return rotation_matrix

class TrailRenderer(Entity):
    def __init__(self,target,segments = 10,resolution=4, thickness=.3, update_speed=1/60,shader = TrailShader, **kwargs):
        super().__init__(**kwargs)

        self.target = target
        self.thickness = thickness
        self.resolution = resolution
        self.segments = segments
        self.vertices = []
        self.triangles = []
        self.trace = [self.target.world_position for _ in range(segments+1)]
        self.uv = []
        for i in range(segments):
            self.vertices += [self.target.world_position + Vec3(0,1,0)*math.cos(math.radians(j/resolution*360))*thickness/2 + Vec3(1,0,0)*math.sin(math.radians(j/resolution*360))*thickness/2 for j in range(resolution)]
            self.uv += [[i/segments,j/resolution] for j in range(resolution)]
            if i!=segments-1:
                for j in range(resolution):
                    self.triangles.append([i*resolution+j,(i+1)*resolution+j,i*resolution+(j+1)%resolution])
                    self.triangles.append([i*resolution+(j+1)%resolution,(i+1)*resolution+j,(i+1)*resolution+(j+1)%resolution])
                    
            
        self.vertices += [self.target.world_position]
        self.uv.append([1,0.5])
        self.triangles += [[i*resolution+(j+1)%resolution,i*resolution+j,segments*resolution] for j in range(resolution)]
        self.model = Mesh(
            vertices=self.vertices,
            uvs=self.uv,
            triangles=self.triangles)
        self.model.generate()
        self.update_speed = update_speed
        self.shader = shader
        self._t = 0



    def update(self):
        self._t += time.dt
        if self._t > self.update_speed:
            self._t = 0
            self.trace.insert(0,self.target.world_position)
            self.trace.pop()
            self.vertices = []
            for i in range(self.segments):
                direction = self.trace[i] - self.trace[i+1]
                direction.normalize()
                direction = np.array(direction)
                transformation_matrix = rotation_matrix_from_vectors((0,0,1),direction)
                offset_vert = transformation_matrix.dot((0,1,0))*self.thickness/2*(1-i/self.segments)
                offset_hor = transformation_matrix.dot((1,0,0))*self.thickness/2*(1-i/self.segments)
                vert = self.trace[i]
                self.vertices += [vert + offset_vert*math.cos(math.radians(j/self.resolution*360)) + offset_hor*math.sin(math.radians(j/self.resolution*360)) for j in range(self.resolution)]
            
            self.vertices.append(self.trace[self.segments])
            
            self.model.vertices = self.vertices
            self.model.generate()

    def reset(self):
        self.trace = [self.target.world_position for _ in range(self.segments+1)]
        base_offset = Vec3(0,1,0)*.5*self.thickness
        self.vertices = []
        for i in range(self.segments):
            offset = base_offset*(1-i/self.segments)
            self.vertices += [self.target.world_position - offset,self.target.world_position + offset]
        self.vertices += [self.target.world_position]
        self.model.vertices = self.vertices
        self.model.generate()


if __name__ == '__main__':

    app = Ursina(vsync=False)
    Entity(model="cube",scale = 5,texture="white_cube",double_sided=True,collider="box")

    EditorCamera()
    class Bullet(Entity):
        def __init__(self, **kwargs):
            super().__init__(model="sphere", color=color.black, scale=.1, **kwargs)
            self.tr = TrailRenderer(self,resolution=10,thickness=.1)
        
        def update(self):
            self.position = mouse.world_point if mouse.world_point else self.position 


    bullet = Bullet()

    
    app.run()